import React from 'react';
import { SavedProvider } from '../context/SavedContext';
import { SidebarProvider } from '../context/SidebarContext';
import { CreateMenuProvider } from '../context/CreateMenuContext';
import { ProfileProvider } from '../context/ProfileContext';
import { PostsProvider } from '../context/PostsContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import { MessagingUnreadProvider } from '../context/MessagingUnreadContext';
import { UserJobsProvider } from '../context/UserJobsContext';
import { ConnectionsProvider } from '../context/ConnectionsContext';

/**
 * Private product providers. Mount only while the authenticated tree is
 * active, keyed by Nest user id so account A cannot leak into B.
 */
export function AuthenticatedProviders({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  return (
    <SavedProvider key={userId}>
      <SidebarProvider>
        <CreateMenuProvider>
          <ProfileProvider>
            <PostsProvider>
              <NotificationsProvider>
                <MessagingUnreadProvider>
                  <UserJobsProvider>
                    <ConnectionsProvider>
                      {children}
                    </ConnectionsProvider>
                  </UserJobsProvider>
                </MessagingUnreadProvider>
              </NotificationsProvider>
            </PostsProvider>
          </ProfileProvider>
        </CreateMenuProvider>
      </SidebarProvider>
    </SavedProvider>
  );
}
