import React from 'react';
import { ProfileSelectorDropdown } from '../../features/profiles';
import { GlobalSearch } from '../search/GlobalSearch';

export const Header: React.FC = () => (
  <header className="shell-header">
    <GlobalSearch />
    <div className="header-right-area">
      <ProfileSelectorDropdown />
    </div>
  </header>
);
