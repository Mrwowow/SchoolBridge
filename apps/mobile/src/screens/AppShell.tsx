/**
 * AppShell — the main role-aware application surface, faithful to the mockup's
 * App() (app.jsx): per-tab header, scrollable body, 5-tab bottom bar, and a chat
 * sub-view. The role is derived from the logged-in user (no manual switcher).
 */
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../design/ThemeProvider';
import { Avatar, AppHeader, RoundBtn } from '../design/components';
import { Icon } from '../design/Icon';

import { ParentHome } from './ParentHome';
import { ReportDetail } from './ReportDetail';
import { HomeworkScreen } from './HomeworkScreen';
import { ChatThread } from './ChatThread';
import { ProfileScreen } from './ProfileScreen';
import { TeacherHome } from './TeacherHome';
import { TeacherInbox } from './TeacherInbox';
import { TeacherHomework } from './TeacherHomework';
import { AttendanceScreen } from './AttendanceScreen';
import { ResultsScreen } from './ResultsScreen';
import { SubjectsScreen } from './SubjectsScreen';

import { useChildren, useClasses } from '../hooks';
import type { ChildSummary } from '@schoolbridge/types';
import type { ClassItem } from '../api';
import { CHILD, TEACHER, TODAY, SCHOOL, INBOX, type InboxThread } from '../mock/data';

export type Role = 'parent' | 'teacher';

/** InboxThread carries an optional pupilId once mapped from live data. */
type InboxPeer = InboxThread & { pupilId?: string };

/** A pupil the teacher has selected to act on (write report / view profile). */
export interface SelectedPupil {
  id: string;
  fullName: string;
}

/** Full-screen teacher sub-views reachable from the home quick actions. */
type TeacherView = 'attendance' | 'results' | 'subjects';

interface Tab {
  id: string;
  icon: string;
  label: string;
}

function tabsFor(role: Role, childFirstName: string): Tab[] {
  return role === 'parent'
    ? [
        { id: 'home', icon: 'home', label: 'Home' },
        { id: 'report', icon: 'report', label: 'Report' },
        { id: 'homework', icon: 'homework', label: 'Homework' },
        { id: 'messages', icon: 'chat', label: 'Chat' },
        { id: 'profile', icon: 'user', label: childFirstName },
      ]
    : [
        { id: 'home', icon: 'home', label: 'Class' },
        { id: 'report', icon: 'report', label: 'Reports' },
        { id: 'homework', icon: 'homework', label: 'Homework' },
        { id: 'messages', icon: 'chat', label: 'Inbox' },
        { id: 'profile', icon: 'user', label: 'Pupil' },
      ];
}

export function AppShell({
  role,
  parentName = 'Ngozi',
  parentInitials = 'NO',
  onOpenProfileMenu,
}: {
  role: Role;
  parentName?: string;
  parentInitials?: string;
  onOpenProfileMenu?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('home');
  const [chatPeer, setChatPeer] = useState<InboxPeer | null>(null);
  const [inChat, setInChat] = useState(false);
  const [selectedPupil, setSelectedPupil] = useState<SelectedPupil | null>(null);
  const [classIdx, setClassIdx] = useState(0);
  const [teacherView, setTeacherView] = useState<TeacherView | null>(null);

  // ── Live roster ──
  // Parent: their children → the first is the "active" pupil whose data drives
  // every parent screen. Teacher: their classes → the selected class scopes the
  // roster / homework / inbox views. Everything falls back to mock when empty.
  const { data: children } = useChildren();
  const { data: classes } = useClasses();

  const activeChild: ChildSummary | undefined =
    role === 'parent' ? children?.[0] : undefined;
  const activePupilId = activeChild?.id;
  const teacherClasses: ClassItem[] = role === 'teacher' ? classes ?? [] : [];
  const activeClass = teacherClasses[classIdx] ?? teacherClasses[0];
  const activeClassId = activeClass?.id;

  // The pupil a teacher is acting on: an explicit roster selection, else the
  // pupil of an open chat thread.
  const teacherPupilId = selectedPupil?.id ?? chatPeer?.pupilId;

  // Display strings for headers/tabs, with mock fallback.
  const childFirst = activeChild?.fullName?.split(' ')[0] ?? CHILD.first;
  const childClass = activeChild?.className ?? CHILD.klass;
  const teacherPupilName =
    selectedPupil?.fullName ?? (chatPeer ? chatPeer.child : CHILD.name);

  const cycleClass = () => {
    if (teacherClasses.length > 1) setClassIdx((i) => (i + 1) % teacherClasses.length);
  };

  const selectPupil = (p: SelectedPupil) => {
    setSelectedPupil(p);
    setTeacherView(null);
    setInChat(false);
    setTab('report');
  };

  const go = (id: string) => {
    setInChat(false);
    setChatPeer(null);
    setTeacherView(null);
    setTab(id);
  };
  const openChat = (peer: InboxPeer) => {
    setChatPeer(peer);
    setInChat(true);
  };
  const backFromChat = () => {
    setInChat(false);
    setChatPeer(null);
  };

  const teacherChat = role === 'teacher' && inChat;
  const inTeacherView = role === 'teacher' && teacherView !== null;
  const showTabBar = !teacherChat && !inTeacherView;

  // ── Teacher full-screen sub-views (attendance / results / subjects) ──
  if (inTeacherView) {
    const backToHome = () => setTeacherView(null);
    let viewHeaderTitle = '';
    let viewBody: React.ReactNode = null;
    if (teacherView === 'attendance') {
      viewHeaderTitle = 'Attendance';
      viewBody = (
        <AttendanceScreen classId={activeClassId} className={activeClass?.name} onDone={backToHome} />
      );
    } else if (teacherView === 'results') {
      viewHeaderTitle = 'Results';
      viewBody = (
        <ResultsScreen classId={activeClassId} className={activeClass?.name} onDone={backToHome} />
      );
    } else {
      viewHeaderTitle = 'Subjects';
      viewBody = <SubjectsScreen onDone={backToHome} />;
    }
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
        <AppHeader back onBack={backToHome} title={viewHeaderTitle} subtitle={activeClass?.name ?? SCHOOL} />
        <ScrollBody insetBottom={insets.bottom}>{viewBody}</ScrollBody>
      </View>
    );
  }

  // ── Header ──
  let header: React.ReactNode;
  if (inChat) {
    const peer = chatPeer;
    header = (
      <AppHeader
        back
        onBack={backFromChat}
        avatar={<Avatar initials={peer ? peer.initials : TEACHER.initials} hue={peer ? peer.hue : 200} size={38} />}
        title={role === 'teacher' && peer ? peer.parent : TEACHER.name}
        subtitle={role === 'teacher' && peer ? `Parent of ${peer.child}` : 'Class teacher · online'}
      />
    );
  } else if (role === 'parent') {
    header = {
      home: (
        <AppHeader big avatar={<Avatar initials={parentInitials} hue={12} size={44} />} title={`Hi, ${parentName}`} subtitle={SCHOOL} right={<RoundBtn icon="dots" onPress={onOpenProfileMenu} />} />
      ),
      report: <AppHeader title="Daily Report" subtitle={TODAY} right={<RoundBtn icon="bell" badge="2" />} />,
      homework: <AppHeader title="Homework" subtitle={childClass} right={<RoundBtn icon="calendar" />} />,
      messages: <AppHeader avatar={<Avatar initials={TEACHER.initials} hue={200} size={40} />} title={TEACHER.name} subtitle="Class teacher · online" />,
      profile: <AppHeader title={`${childFirst}'s progress`} subtitle="This term" right={<RoundBtn icon="dots" onPress={onOpenProfileMenu} />} />,
    }[tab];
  } else {
    const teacherClassName = activeClass?.name ?? TEACHER.klass;
    const pupilFirst = teacherPupilName.split(' ')[0];
    header = {
      home: (
        <AppHeader
          big
          avatar={<Avatar initials={TEACHER.initials} hue={200} size={44} />}
          title={`Hi, ${TEACHER.first}`}
          subtitle={
            teacherClasses.length > 1
              ? `${teacherClassName} · tap to switch`
              : teacherClassName
          }
          right={
            teacherClasses.length > 1 ? (
              <RoundBtn icon="chevR" onPress={cycleClass} />
            ) : (
              <RoundBtn icon="dots" onPress={onOpenProfileMenu} />
            )
          }
        />
      ),
      report: <AppHeader title="Write Report" subtitle={`${teacherPupilName} · ${teacherClassName}`} right={<RoundBtn icon="dots" />} />,
      homework: <AppHeader title="Homework" subtitle={teacherClassName} right={<RoundBtn icon="calendar" />} />,
      messages: <AppHeader title="Messages" subtitle={`${INBOX.length} conversations`} right={<RoundBtn icon="edit" />} />,
      profile: <AppHeader title={`${pupilFirst}'s progress`} subtitle="Pupil overview" right={<RoundBtn icon="dots" />} />,
    }[tab];
  }

  // ── Body ──
  let body: React.ReactNode;
  const scrollable = !(inChat || tab === 'messages');

  if (inChat) {
    body = <ChatThread role={role} pupilId={chatPeer?.pupilId} />;
  } else if (role === 'parent') {
    if (tab === 'messages') {
      body = <ChatThread role="parent" pupilId={activePupilId} />;
    } else {
      body = {
        home: <ParentHome go={go} pupilId={activePupilId} child={activeChild} />,
        report: <ReportDetail role="parent" go={go} pupilId={activePupilId} child={activeChild} />,
        homework: <HomeworkScreen role="parent" pupilId={activePupilId} />,
        profile: <ProfileScreen pupilId={activePupilId} child={activeChild} />,
      }[tab];
    }
  } else {
    if (tab === 'messages') {
      body = (
        <ScrollBody insetBottom={insets.bottom}>
          <TeacherInbox onOpen={openChat} />
        </ScrollBody>
      );
    } else {
      body = {
        home: (
          <TeacherHome
            go={go}
            classId={activeClassId}
            className={activeClass?.name}
            onSelectPupil={selectPupil}
            onOpenView={(v) => setTeacherView(v)}
          />
        ),
        report: (
          <ReportDetail
            role="teacher"
            go={go}
            pupilId={teacherPupilId}
            child={selectedPupil ? { fullName: selectedPupil.fullName } : undefined}
          />
        ),
        homework: <TeacherHomework classId={activeClassId} className={activeClass?.name} />,
        profile: <ProfileScreen pupilId={teacherPupilId} child={selectedPupil ? { fullName: selectedPupil.fullName } : undefined} />,
      }[tab];
    }
  }

  const tabs = tabsFor(role, childFirst);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      {header}
      {scrollable && tab !== 'messages' ? (
        <ScrollBody insetBottom={insets.bottom}>{body}</ScrollBody>
      ) : (
        <View style={{ flex: 1 }}>{body}</View>
      )}

      {showTabBar && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            backgroundColor: theme.surface,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 10),
          }}
        >
          {tabs.map((t) => {
            const on = !inChat && tab === t.id;
            return (
              <Pressable key={t.id} onPress={() => go(t.id)} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <Icon name={t.icon} size={24} stroke={on ? 2.3 : 1.9} color={on ? theme.primary : theme.muted2} />
                <Text style={{ fontSize: 10.5, fontWeight: on ? '700' : '600', color: on ? theme.primary : theme.muted2 }}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function ScrollBody({ children, insetBottom }: { children: React.ReactNode; insetBottom: number }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 2, paddingBottom: 28 + insetBottom }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export const shellStyles = StyleSheet.create({});
