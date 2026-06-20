/**
 * app/(tabs)/_layout.tsx
 * Bottom tab navigator — role-aware.
 *
 * PARENT sees:  Home | Messages | Notifications | Profile
 * TEACHER sees: Classes | Compose | Notifications | Profile
 *
 * The "Messages" tab for parents is a placeholder — the primary message
 * surface is pupil/[id].tsx (booklet feed) reached from the Home tab.
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, Text, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, FontSize } from '../../src/theme';

/* Minimal SVG-free icon using text glyphs for zero-dep icon set */
function TabIcon({
  glyph,
  focused,
}: {
  glyph: string;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <Text
        style={[
          styles.glyph,
          { color: focused ? Colors.tabActive : Colors.tabInactive },
        ]}
      >
        {glyph}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);

  // Determine role from first membership; default to PARENT
  const role = user?.memberships[0]?.role ?? 'PARENT';
  const isTeacher = role === 'TEACHER' || role === 'CLASS_TEACHER';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBackground,
          borderTopColor: Colors.border,
          paddingBottom: Platform.OS === 'ios' ? 0 : 4,
          height: Platform.OS === 'ios' ? 84 : 60,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      {/* HOME — parent sees children list; teacher sees class list */}
      <Tabs.Screen
        name="index"
        options={{
          title: isTeacher ? 'Classes' : 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph={isTeacher ? '📚' : '🏠'} focused={focused} />
          ),
        }}
      />

      {/* MESSAGES (parent) / COMPOSE (teacher) */}
      <Tabs.Screen
        name="messages"
        options={{
          title: isTeacher ? 'Compose' : 'Messages',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph={isTeacher ? '✏️' : '💬'} focused={focused} />
          ),
          href: isTeacher ? null : '/messages',  // hide from teacher (they use compose.tsx)
        }}
      />

      {/* COMPOSE — only visible to teachers via compose.tsx modal, not a tab */}
      {/* Teacher gets a dedicated Compose tab that links to the compose screen */}
      <Tabs.Screen
        name="compose-tab"
        options={{
          title: 'Compose',
          href: isTeacher ? '/compose' : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="✏️" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="🔔" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="👤" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  glyph: {
    fontSize: 20,
  },
});
