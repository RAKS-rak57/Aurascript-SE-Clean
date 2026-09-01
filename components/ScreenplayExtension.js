import { Extension } from '@tiptap/core';

export const ScreenplayExtension = Extension.create({
  name: 'screenplay',

  addCommands() {
    return {
      setScreenplayFormat: (formatType) => ({ commands }) => {
        return commands.updateAttributes('paragraph', { class: formatType });
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Tab': ({ commands, editor }) => {
        const { $from } = editor.state.selection;
        const node = $from.parent;
        const currentClass = node.attrs.class || 'action';

        let nextClass = 'action';
        if (currentClass === 'action') nextClass = 'character';
        else if (currentClass === 'character') nextClass = 'parenthetical';
        else if (currentClass === 'parenthetical') nextClass = 'dialogue';
        else if (currentClass === 'dialogue') nextClass = 'action';
        else if (currentClass === 'scene-heading') nextClass = 'action';

        return commands.updateAttributes('paragraph', { class: nextClass });
      },
      'Enter': ({ commands, editor }) => {
        const { $from } = editor.state.selection;
        const node = $from.parent;
        const currentClass = node.attrs.class || 'action';

        let nextClass = 'action';
        if (currentClass === 'character') nextClass = 'dialogue';
        else if (currentClass === 'parenthetical') nextClass = 'dialogue';
        else if (currentClass === 'scene-heading') nextClass = 'action';

        return commands.insertContent(`<p class="${nextClass}"></p>`);
      }
    };
  }
});
