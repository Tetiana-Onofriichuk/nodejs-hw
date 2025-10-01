import createHttpError from 'http-errors';
import { Note } from '../models/note.js';

export const getAllNotes = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, tag, search } = req.query;
    const skip = (page - 1) * perPage;

    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hasSearch = typeof search === 'string' && search.trim() !== '';
    const rx = hasSearch ? new RegExp(esc(search.trim()), 'i') : null;

    let notesQuery = Note.find().where('userId').equals(req.user._id);
    if (tag) notesQuery = notesQuery.where('tag').equals(tag);
    if (hasSearch) notesQuery = notesQuery.or([{ title: rx }, { content: rx }]);

    let countQuery = Note.countDocuments().where('userId').equals(req.user._id);
    if (tag) countQuery = countQuery.where('tag').equals(tag);
    if (hasSearch) countQuery = countQuery.or([{ title: rx }, { content: rx }]);

    const [totalNotes, notes] = await Promise.all([
      countQuery.exec(),
      notesQuery.skip(skip).limit(perPage).lean().exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalNotes / perPage));

    return res.status(200).json({
      page,
      perPage,
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
