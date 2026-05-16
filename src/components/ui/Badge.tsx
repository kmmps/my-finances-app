import type { Tag } from '../../types';

interface Props {
  tag: Tag;
  small?: boolean;
}

export default function Badge({ tag, small = false }: Props) {
  return (
    <span className={`tag-${tag.color} rounded-full font-medium flex items-center gap-0.5 ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}>
      <span>{tag.emoji}</span>
      <span>{tag.name}</span>
    </span>
  );
}
