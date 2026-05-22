import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-6 items-center">
      <span className="font-bold text-sm mr-4">Feed Planner</span>
      <NavLink
        to="/"
        className={({ isActive }) =>
          `text-sm ${isActive ? 'text-black font-semibold' : 'text-gray-400 hover:text-black'}`
        }
      >
        Feed
      </NavLink>
      <NavLink
        to="/planner"
        className={({ isActive }) =>
          `text-sm ${isActive ? 'text-black font-semibold' : 'text-gray-400 hover:text-black'}`
        }
      >
        Planner
      </NavLink>
    </div>
  )
}
