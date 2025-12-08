import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useTheme } from '@/components/theme-provider';

interface Props {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  disabled?: boolean;
}

export function RichTextEditor({ value, onChange, height = 300, disabled = false }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const { theme } = useTheme();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="rounded-md border overflow-hidden">
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey='gpl'
        onInit={(_evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={onChange}
        disabled={disabled}
        init={{
          height: height,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: `
            body { font-family:Inter,sans-serif; font-size:14px; }
            body { background-color: ${isDark ? '#020817' : '#ffffff'}; color: ${isDark ? '#f8fafc' : '#0f172a'}; }
          `,
          skin: isDark ? 'oxide-dark' : 'oxide',
          content_css: isDark ? 'dark' : 'default',
          branding: false,
          promotion: false,
        }}
      />
    </div>
  );
}