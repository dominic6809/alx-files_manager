/* eslint-disable import/no-named-as-default */
import { writeFile } from 'fs';
import { promisify } from 'util';
import Queue from 'bull/lib/queue';
import imgThumbnail from 'image-thumbnail';
import mongoDBCore from 'mongodb/lib/core';
import dbClient from './utils/db';
import Mailer from './utils/mailer';

const writeFileAsync = promisify(writeFile);
const fileQueue = new Queue('thumbnail generation');
const userQueue = new Queue('email sending');

/**
 * Generates the thumbnail of an image with a given width size.
 * @param {String} filePath The location of the original file.
 * @param {number} size The width of the thumbnail.
 * @returns {Promise<void>} Returns a promise that resolves when the thumbnail is saved.
 */
const generateThumbnail = async (filePath, size) => {
  try {
    const buffer = await imgThumbnail(filePath, { width: size });
    console.log(`Generating thumbnail for file: ${filePath}, size: ${size}`);
    await writeFileAsync(`${filePath}_${size}`, buffer);
  } catch (error) {
    console.error(`Error generating thumbnail for file: ${filePath}, size: ${size}`, error);
    throw new Error(`Failed to generate thumbnail for file: ${filePath}`);
  }
};

// Process the fileQueue for generating image thumbnails
fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    const error = new Error('Missing fileId');
    console.error(error.message);
    return done(error);
  }

  if (!userId) {
    const error = new Error('Missing userId');
    console.error(error.message);
    return done(error);
  }

  console.log('Processing job for file:', job.data.name || 'Unnamed file');
  
  try {
    // Fetch file from the database
    const file = await (await dbClient.filesCollection())
      .findOne({
        _id: new mongoDBCore.BSON.ObjectId(fileId),
        userId: new mongoDBCore.BSON.ObjectId(userId),
      });

    if (!file) {
      const error = new Error('File not found');
      console.error(error.message);
      return done(error);
    }

    // Generate thumbnails for the specified sizes
    const sizes = [500, 250, 100];
    await Promise.all(sizes.map((size) => generateThumbnail(file.localPath, size)));

    console.log('Thumbnails generated successfully');
    done(); // Mark job as done
  } catch (error) {
    console.error('Error processing file job:', error);
    done(error); // Pass error to Bull for retry or failure handling
  }
});

// Process the userQueue for sending email
userQueue.process(async (job, done) => {
  const { userId } = job.data;

  if (!userId) {
    const error = new Error('Missing userId');
    console.error(error.message);
    return done(error);
  }

  try {
    // Fetch user from the database
    const user = await (await dbClient.usersCollection())
      .findOne({ _id: new mongoDBCore.BSON.ObjectId(userId) });

    if (!user) {
      const error = new Error('User not found');
      console.error(error.message);
      return done(error);
    }

    console.log(`Sending welcome email to ${user.email}`);

    // Build and send the welcome email
    const mailSubject = 'Welcome to ALX-Files_Manager by B3zaleel';
    const mailContent = [
      '<div>',
      '<h3>Hello {{user.name}},</h3>',
      'Welcome to <a href="https://github.com/B3zaleel/alx-files_manager">',
      'ALX-Files_Manager</a>, ',
      'a simple file management API built with Node.js by ',
      '<a href="https://github.com/B3zaleel">Bezaleel Olakunori</a>. ',
      'We hope it meets your needs.',
      '</div>',
    ].join('');

    // Send email using Mailer utility
    Mailer.sendMail(Mailer.buildMessage(user.email, mailSubject, mailContent));
    done(); // Mark job as done
  } catch (error) {
    console.error('Error processing email job:', error);
    done(error); // Pass error to Bull for retry or failure handling
  }
});
