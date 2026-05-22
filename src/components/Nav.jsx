import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-0 flex items-center gap-1">
      <span className="font-bold text-sm text-gray-900 pr-5 py-4 border-r border-gray-100 mr-3">
        Feed Planner
      </span>
      <NavLink
        to="/"
        className={({ isActive }) =>
          `text-sm px-3 py-4 border-b-2 transition-colors ${
            isActive
              ? 'border-gray-900 text-gray-900 font-medium'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`
        }
      >
        Feed
      </NavLink>
      <NavLink
        to="/planner"
        className={({ isActive }) =>
          `text-sm px-3 py-4 border-b-2 transition-colors ${
            isActive
              ? 'border-gray-900 text-gray-900 font-medium'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`
        }
      >
        Planner
      </NavLink>
    </div>
  )
}
