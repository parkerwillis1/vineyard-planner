import { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabaseClient';

/**
 * Hook to fetch and cache user profile data including profile picture
 */
export function useUserProfile(user) {
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfilePictureUrl(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchProfilePicture = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('profile_data')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile picture:', error);
          return;
        }

        if (isMounted && data?.profile_data?.profilePictureUrl) {
          setProfilePictureUrl(data.profile_data.profilePictureUrl);
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfilePicture();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (isMounted && payload.new?.profile_data?.profilePictureUrl) {
            setProfilePictureUrl(payload.new.profile_data.profilePictureUrl);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [user?.id]);

  return { profilePictureUrl, loading };
}
