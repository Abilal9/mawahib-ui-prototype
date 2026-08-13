/**
 * Attachments are stored on work-request terms notes until file storage ships.
 * Formats supported:
 * - `Attachments: Brief.pdf, Moodboard.pdf`
 * - `Attachments: Brief.pdf (1.2 MB), Moodboard.pdf (3.1 MB)`
 */

export type WorkRequestAttachment = {
  id: string;
  name: string;
  size?: string;
  /** Present only when a real URL was stored. */
  url?: string;
};

const ATTACHMENTS_LINE = /Attachments:\s*(.+)$/im;
const NAMED_WITH_SIZE = /^(.+?)\s*\(([^)]+)\)\s*$/;

export function parseAttachmentsFromNotes(
  notes: string | null | undefined,
): WorkRequestAttachment[] {
  if (!notes?.trim()) return [];
  const match = notes.match(ATTACHMENTS_LINE);
  if (!match?.[1]) return [];

  return match[1]
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => {
      const sized = part.match(NAMED_WITH_SIZE);
      if (sized) {
        return {
          id: `att-${index}-${sized[1].trim()}`,
          name: sized[1].trim(),
          size: sized[2].trim(),
        };
      }
      return { id: `att-${index}-${part}`, name: part };
    });
}

/** Strip the attachments line from notes for display as free text. */
export function notesWithoutAttachments(
  notes: string | null | undefined,
): string {
  if (!notes) return '';
  return notes.replace(ATTACHMENTS_LINE, '').trim();
}

export function formatAttachmentsNoteLine(
  files: Array<{ name: string; size?: string }>,
): string {
  if (files.length === 0) return '';
  return `Attachments: ${files
    .map((f) => (f.size ? `${f.name} (${f.size})` : f.name))
    .join(', ')}`;
}

export function attachmentIcon(
  name: string,
): 'document-text-outline' | 'image-outline' | 'archive-outline' | 'document-outline' {
  const lower = name.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|heic)$/.test(lower)) return 'image-outline';
  if (/\.(zip|rar|7z)$/.test(lower)) return 'archive-outline';
  if (/\.(pdf|docx?|xlsx?|pptx?|txt)$/.test(lower)) return 'document-text-outline';
  return 'document-outline';
}
