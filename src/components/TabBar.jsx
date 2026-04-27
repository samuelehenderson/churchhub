import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  IconHome,
  IconLive,
  IconChurch,
  IconMap,
  IconQuiz,
  IconAdmin
} from './Icons.jsx';

const tabs = [
  { to: '/', label: 'Home', Icon: IconHome, end: true },
  { to: '/live', label: 'Live', Icon: IconLive },
  { to: '/churches', label: 'Churches', Icon: IconChurch },
  { to: '/map', label: 'Map', Icon: IconMap },
  { to: '/quiz', label: 'Quiz', Icon: IconQuiz },
  { to: '/admin', label: 'Admin', Icon: IconAdmin }
];

export default function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Primary">
      <div className="tab-bar-inner">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
