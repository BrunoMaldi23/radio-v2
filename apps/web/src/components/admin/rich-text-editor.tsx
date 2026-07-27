'use client';

import { useCallback, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import ImageExt from '@tiptap/extension-image';
import LinkExt from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignEndVertical,
  Maximize,
  Minus,
} from 'lucide-react';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';

// Custom image node with alignment support
const Figure = Node.create({
  name: 'figure',
  group: 'block',
  content: 'inline*',
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      title: { default: '' },
      align: { default: 'center' },
      width: { default: '100' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-align]',
        getAttrs: (el) => ({
          src: (el as HTMLElement).querySelector('img')?.getAttribute('src') ?? null,
          alt: (el as HTMLElement).querySelector('img')?.getAttribute('alt') ?? '',
          align: (el as HTMLElement).getAttribute('data-align') || 'center',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const align = HTMLAttributes.align || 'center';
    const width = HTMLAttributes.width || '100';
    const wrapClasses = align === 'left' ? 'float-left mr-5 mb-3' :
      align === 'right' ? 'float-right ml-5 mb-3' :
      'mx-auto';

    return [
      'figure',
      mergeAttributes(HTMLAttributes, {
        'data-align': align,
        class: `${wrapClasses} ${align !== 'full' ? 'max-w-[50%]' : 'w-full'}`,
        style: align === 'full' ? 'width: 100%; clear: both;' : '',
      }),
      ['img', { src: HTMLAttributes.src, alt: HTMLAttributes.alt, class: 'rounded-lg shadow-sm w-full h-auto', style: align === 'full' ? 'width: 100%' : '' }],
    ];
  },
});

function ToolbarButton({
  onClick,
  active,
  children,
  label,
}: {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-md text-sm transition ${
        active ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-amber-200'
      }`}
    >
      {children}
    </button>
  );
}

function ImageFloatingMenu({ editor }: { editor: Editor }) {
  const isImageSelected = editor.isActive('figure');

  if (!isImageSelected) return null;

  const setAlign = (align: string) => {
    editor.chain().focus().updateAttributes('figure', { align }).run();
  };

  const currentAlign = editor.getAttributes('figure').align || 'center';

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-bold text-amber-900 shadow-sm">
      <AlignStartVertical className="h-3.5 w-3.5 text-amber-600" />
      <span className="mr-1">Posicion imagen:</span>
      <button
        type="button"
        onClick={() => setAlign('left')}
        className={`rounded px-2 py-0.5 text-xs transition ${currentAlign === 'left' ? 'bg-amber-300 text-slate-950' : 'text-amber-800 hover:bg-amber-100'}`}
      >
        Izquierda
      </button>
      <button
        type="button"
        onClick={() => setAlign('center')}
        className={`rounded px-2 py-0.5 text-xs transition ${currentAlign === 'center' ? 'bg-amber-300 text-slate-950' : 'text-amber-800 hover:bg-amber-100'}`}
      >
        Centro
      </button>
      <button
        type="button"
        onClick={() => setAlign('right')}
        className={`rounded px-2 py-0.5 text-xs transition ${currentAlign === 'right' ? 'bg-amber-300 text-slate-950' : 'text-amber-800 hover:bg-amber-100'}`}
      >
        Derecha
      </button>
      <button
        type="button"
        onClick={() => setAlign('full')}
        className={`rounded px-2 py-0.5 text-xs transition ${currentAlign === 'full' ? 'bg-amber-300 text-slate-950' : 'text-amber-800 hover:bg-amber-100'}`}
      >
        Ancho completo
      </button>
    </div>
  );
}

function MenuBar({ editor }: { editor: Editor }) {
  const addImage = useCallback(() => {
    const url = window.prompt('URL de la imagen:');
    if (url) {
      editor.chain().focus().insertContent({
        type: 'figure',
        attrs: { src: url, align: 'center' },
      }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt('URL del enlace:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-lg border-b border-slate-900/10 bg-slate-950 px-3 py-2">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="Negrita">
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="Italica">
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-white/15" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} label="Titulo">
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="Subtitulo">
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-white/15" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="Lista">
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="Lista ordenada">
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} label="Cita">
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-white/15" />
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} label="Alinear izquierda">
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} label="Centrar">
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} label="Alinear derecha">
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-white/15" />
      <ToolbarButton onClick={addImage} active={editor.isActive('figure')} label="Imagen">
        <Image className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={addLink} active={editor.isActive('link')} label="Enlace">
        <Link className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-white/15" />
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} active={false} label="Deshacer">
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} active={false} label="Rehacer">
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aqui...',
  minHeight = 200,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        link: false,
      }),
      Placeholder.configure({ placeholder }),
      Figure,
      LinkExt.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none px-4 py-3 min-h-[200px] text-zinc-800 [&_p.is-editor-empty:first-child::before]:text-zinc-400 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:h-0',
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-900/10 bg-white shadow-sm">
      <MenuBar editor={editor} />
      <div className="px-4 pt-2">
        <ImageFloatingMenu editor={editor} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
