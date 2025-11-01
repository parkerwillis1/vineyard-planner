import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export function DropdownMenu({ children, trigger }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 192; // w-48 = 192px

      setPosition({
        top: rect.bottom + 4,
        left: rect.right - dropdownWidth
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <div className="relative inline-block" ref={triggerRef}>
        <div onClick={() => setIsOpen(!isOpen)}>
          {trigger}
        </div>
      </div>
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[60]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                onClick: () => {
                  if (child.props.onClick) {
                    child.props.onClick();
                  }
                  setIsOpen(false);
                }
              });
            }
            return child;
          })}
        </div>,
        document.body
      )}
    </>
  );
}

export function DropdownMenuTrigger({ children, className = '' }) {
  return (
    <button
      className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
      type="button"
    >
      {children || <MoreVertical className="w-5 h-5 text-gray-600" />}
    </button>
  );
}

export function DropdownMenuItem({ children, icon: Icon, onClick, variant = 'default', className = '' }) {
  const variantStyles = {
    default: 'text-gray-700 hover:bg-gray-50',
    primary: 'text-green-700 hover:bg-green-50',
    warning: 'text-amber-700 hover:bg-amber-50',
    danger: 'text-red-700 hover:bg-red-50',
    info: 'text-blue-700 hover:bg-blue-50'
  };

  return (
    <button
      onClick={onClick}
      type="button"
      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${variantStyles[variant]} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-gray-200 my-1" />;
}
