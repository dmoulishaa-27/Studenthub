import {
  BookOpen,
  Code2,
  FileText,
  FolderKanban,
  GraduationCap,
  User,
} from 'lucide-react';
import { TaskCategory } from '../types';

interface CategoryIconProps {
  category: TaskCategory;
  className?: string;
}

export function CategoryIcon({ category, className = 'h-4 w-4' }: CategoryIconProps) {
  switch (category) {
    case 'Assignments':
      return <FileText className={className} />;
    case 'Projects':
      return <FolderKanban className={className} />;
    case 'Examinations':
      return <GraduationCap className={className} />;
    case 'Coding Practice':
      return <Code2 className={className} />;
    case 'Study Sessions':
      return <BookOpen className={className} />;
    case 'Personal Tasks':
      return <User className={className} />;
  }
}
