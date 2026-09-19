'use client';

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  YoutubeIcon,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

// ایجاد نمونه lowlight با زبان‌های پرکاربرد
const lowlight = createLowlight(common);

type RichTextEditorProps = {
  valueJson?: Record<string, unknown> | null;
  valueHtml?: string;
  onChange: (payload: { html: string; json: Record<string, unknown> }) => void;
  placeholder?: string;
};

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded p-1.5 transition-colors ${
        active ? 'bg-primary/15 text-primary' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  valueJson,
  valueHtml,
  onChange,
  placeholder = 'متن مقاله را بنویسید…',
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // غیرفعال کردن codeBlock پیش‌فرض تا از CodeBlockLowlight استفاده کنیم
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Image.configure({
        inline: true,
        allowBase64: true, // اجازه ذخیره base64 (اگر آپلود مستقیم ندارید)
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript', // زبان پیش‌فرض
      }),
      Youtube.configure({
        inline: false,
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'rounded-lg w-full aspect-video',
        },
      }),
    ],
    content: valueJson ?? valueHtml ?? '',
    editorProps: {
      attributes: {
        dir: 'rtl',
        class:
          'min-h-[320px] px-4 py-3 text-sm leading-8 outline-none' +
          '[&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-bold' +
          '[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold' +
          '[&_ol]:list-decimal [&_ol]:pr-6 [&_ul]:list-disc [&_ul]:pr-6' +
          '[&_blockquote]:border-r-4 [&_blockquote]:border-gray-200 [&_blockquote]:pr-4' +
          '[&_blockquote]:text-gray-600 [&_a]:text-primary [&_a]:underline' +
          '[&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:rounded-lg' +
          '[&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre]:text-xs [&_pre]:leading-6' +
          '[&_code]:font-mono ' +
          '[&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4 ' +
          '[&_iframe]:rounded-lg [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:my-4',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange({
        html: ed.getHTML(),
        json: ed.getJSON() as Record<string, unknown>,
      });
    },
  });

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!editor || hydratedRef.current) return;
    if (valueJson) {
      editor.commands.setContent(valueJson);
      hydratedRef.current = true;
      return;
    }
    if (valueHtml != null) {
      editor.commands.setContent(valueHtml);
      hydratedRef.current = true;
    }
  }, [editor, valueJson, valueHtml]);

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('آدرس لینک:', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    if (!editor) return;
    const url = window.prompt('آدرس تصویر (URL):');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addYoutube = () => {
    if (!editor) return;
    const url = window.prompt('آدرس ویدیوی یوتیوب:');
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  };

  if (!editor) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">
        در حال بارگذاری ویرایشگر…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-gray-50 p-2">
        <ToolbarButton
          title="پررنگ"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="مورب"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="زیرخط"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="خط‌خورده"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden />
        <ToolbarButton
          title="عنوان ۲"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="عنوان ۳"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden />
        <ToolbarButton
          title="لیست نقطه‌ای"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="لیست شماره‌دار"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="بلوک کد"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="درج تصویر" onClick={addImage}>
          <ImageIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="درج ویدیو" onClick={addYoutube}>
          <YoutubeIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="نقل‌قول"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="لینک" active={editor.isActive('link')} onClick={setLink}>
          <Link2 className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden />
        <ToolbarButton
          title="راست‌چین"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="وسط‌چین"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="چپ‌چین"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden />
        <ToolbarButton title="بازگشت" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="ازنو" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
