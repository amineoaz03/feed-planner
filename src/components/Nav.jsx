import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Feed', exact: true },
  { to: '/planner', label: 'Planner' },
  { to: '/admin', label: 'Admin' },
]

export default function Nav() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-0 flex items-center gap-1">
      <span className="font-bold text-sm text-gray-900 pr-5 py-4 border-r border-gray-100 mr-3">
        Feed Planner
      </span>
      {links.map(({ to, label, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) =>
            `text-sm px-3 py-4 border-b-2 transition-colors ${
              isActive
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  )
}
