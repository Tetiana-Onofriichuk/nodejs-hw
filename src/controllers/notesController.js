import createHttpError from 'http-errors';
import { Note } from '../models/note.js';

export const getAllNotes = async (req, res) => {
  const { page = 1, perPage = 10, tag, search } = req.query;
  const skip = (page - 1) * perPage;

  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasSearch = typeof search === 'string' && search.trim() !== '';
  const rx = hasSearch ? new RegExp(esc(search.trim()), 'i') : null;

  let notesQuery = Note.find();
  if (tag) notesQuery = notesQuery.where('tag').equals(tag);
  if (hasSearch) notesQuery = notesQuery.or([{ title: rx }, { content: rx }]);

  let countQuery = Note.countDocuments();
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
};

export const getNoteById = async (req, res, next) => {
  const { noteId } = req.params;
  const note = await Note.findById(noteId);

  if (!note) {
    next(createHttpError(404, 'Note not found'));
    return;
  }

  res.status(200).json(note);
};

export const createNote = async (req, res) => {
  const note = await Note.create(req.body);
  res.status(201).json(note);
};

export const deleteNote = async (req, res, next) => {
  const { noteId } = req.params;
  const note = await Note.findOneAndDelete({
    _id: noteId,
  });
  if (!note) {
    next(createHttpError(404, 'Note not found'));
    return;
  }

  res.status(200).json(note);
};

export const updateNote = async (req, res, next) => {
  const { noteId } = req.params;

  const note = await Note.findOneAndUpdate({ _id: noteId }, req.body, {
    new: true,
  });

  if (!note) {
    next(createHttpError(404, 'Note not found'));
    return;
  }

  res.status(200).json(note);
};
