import createHttpError from 'http-errors';
import { Note } from '../models/note.js';

export const getAllNotes = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, tag, search } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const perPageNum = Math.min(100, Math.max(1, Number(perPage) || 10));
    const skip = (pageNum - 1) * perPageNum;

    const filter = { userId: req.user._id };

    if (tag) filter.tag = tag;

    const hasSearch = typeof search === 'string' && search.trim() !== '';
    if (hasSearch) {
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(esc(search.trim()), 'i');
      filter.$or = [{ title: rx }, { content: rx }];
    }

    const [totalNotes, notes] = await Promise.all([
      Note.countDocuments(filter).exec(),
      Note.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPageNum)
        .lean()
        .exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalNotes / perPageNum));

    res.status(200).json({
      page: pageNum,
      perPage: perPageNum,
      totalNotes,
      totalPages,
      notes,
    });
  } catch (err) {
    next(err);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const note = await Note.findOne({ _id: noteId, userId: req.user._id });

    if (!note) throw createHttpError(404, 'Note not found');

    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
};

export const createNote = async (req, res, next) => {
  try {
    if ('userId' in req.body) delete req.body.userId;

    const note = await Note.create({
      ...req.body,
      userId: req.user._id,
    });

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;

    if ('userId' in req.body) delete req.body.userId;

    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId: req.user._id },
      req.body,
      { new: true },
    );

    if (!note) throw createHttpError(404, 'Note not found');

    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const note = await Note.findOneAndDelete({
      _id: noteId,
      userId: req.user._id,
    });

    if (!note) throw createHttpError(404, 'Note not found');

    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
};
