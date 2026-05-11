export default function PhoneMockup({ children }) {
  return (
    <div className="relative mx-auto" style={{ width: 300, height: 620 }}>
      {/* outer frame */}
      <div className="absolute inset-0 rounded-[44px] border-[10px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
        {/* side buttons — decorative */}
        <div className="absolute -left-[14px] top-20 w-[4px] h-8 bg-gray-700 rounded-l" />
        <div className="absolute -left-[14px] top-32 w-[4px] h-12 bg-gray-700 rounded-l" />
        <div className="absolute -left-[14px] top-48 w-[4px] h-12 bg-gray-700 rounded-l" />
        <div className="absolute -right-[14px] top-28 w-[4px] h-16 bg-gray-700 rounded-r" />

        {/* screen */}
        <div className="absolute inset-0 rounded-[36px] bg-white overflow-hidden flex flex-col">
          {/* status bar + notch area */}
          <div className="relative bg-white flex-shrink-0" style={{ height: 44 }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />
            <div className="absolute inset-0 flex items-end justify-between px-6 pb-1 text-[10px] font-semibold">
              <span>9:41</span>
              <span className="flex gap-1 items-center">
                <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor">
                  <rect x="0" y="6" width="2" height="4" rx="0.5"/>
                  <rect x="3" y="4" width="2" height="6" rx="0.5"/>
                  <rect x="6" y="2" width="2" height="8" rx="0.5"/>
                  <rect x="9" y="0" width="2" height="10" rx="0.5"/>
                </svg>
                <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                  <path d="M6 1.5C7.8 1.5 9.4 2.3 10.5 3.5L12 2C10.5 0.7 8.4 0 6 0S1.5.7 0 2l1.5 1.5C2.6 2.3 4.2 1.5 6 1.5z"/>
                  <path d="M6 4.5c1 0 1.9.4 2.5 1L10 4C9 3 7.6 2.5 6 2.5S3 3 2 4l1.5 1.5C4.1 4.9 5 4.5 6 4.5z"/>
                  <circle cx="6" cy="7" r="1.2"/>
                </svg>
                <svg width="22" height="10" viewBox="0 0 22 10" fill="currentColor">
                  <rect x="0" y="1" width="18" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1"/>
                  <rect x="1.5" y="2.5" width="13" height="5" rx="1"/>
                  <path d="M19 3.5v3a1.5 1.5 0 000-3z"/>
                </svg>
              </span>
            </div>
          </div>

          {/* instagram-style header */}
          <div className="flex-shrink-0 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Feed Planner</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </div>

          {/* scrollable photo grid */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>

          {/* home indicator */}
          <div className="flex-shrink-0 flex justify-center py-2 bg-white">
            <div className="w-24 h-1 bg-gray-900 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
