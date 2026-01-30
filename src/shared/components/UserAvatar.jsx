import { useUserProfile } from '@/shared/hooks/useUserProfile';
import { useAuth } from '@/auth/AuthContext';

/**
 * UserAvatar component - displays user profile picture or initials
 * @param {string} size - Size class (e.g., 'w-7 h-7', 'w-10 h-10', 'w-20 h-20')
 * @param {string} textSize - Text size class for initials (e.g., 'text-xs', 'text-sm', 'text-2xl')
 */
export function UserAvatar({ size = 'w-7 h-7', textSize = 'text-xs' }) {
  const { user } = useAuth() || {};
  const { profilePictureUrl } = useUserProfile(user);

  const initials = user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className={`${size} rounded-full bg-vine-green-100 flex items-center justify-center text-vine-green-700 font-semibold ${textSize} overflow-hidden`}>
      {profilePictureUrl ? (
        <img
          src={profilePictureUrl}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}
