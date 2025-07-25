import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

import React from 'react';

interface AdminLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

const AdminLink: React.FC<AdminLinkProps> = ({ href, className = '', children }) => {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
};

export default AdminLink;
