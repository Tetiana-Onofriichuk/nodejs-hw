// userController.js;

import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const updateUserAvatar = async (req, res, next) => {
  if (!req.file) {
    next(createHttpError(400, 'No file'));
    return;
  }

  const result = await saveFileToCloudinary(req.file.buffer);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: result.secure_url },
    { new: true },
  );

  res.status(200).json({ url: user.avatar });
};

export const getMe = async (req, res, next) => {
  const user = await User.findById(req.user._id).select(
    '_id email username avatar',
  );
  if (!user) return next(createHttpError(404, 'User not found'));
  res.status(200).json(user);
};

// ✅ ДОДАТИ: оновити username/email
export const updateMe = async (req, res, next) => {
  const { username, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { ...(username && { username }), ...(email && { email }) },
    { new: true, runValidators: true },
  ).select('_id email username avatar');
  if (!user) return next(createHttpError(404, 'User not found'));
  res.status(200).json(user);
};
