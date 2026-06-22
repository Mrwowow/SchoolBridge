/**
 * SubjectsScreen — view and add subjects for this school.
 * Rendered inside AppShell's ScrollView + header — do NOT add ScrollView/SafeArea.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTheme } from '../design/ThemeProvider';
import { Card, SectionLabel } from '../design/components';
import { Icon } from '../design/Icon';
import { useSubjects, useCreateSubject } from '../hooks';
import type { Subject } from '../api';

export function SubjectsScreen({ onDone }: { onDone: () => void }) {
  const theme = useTheme();

  const { data: subjects, isLoading } = useSubjects();
  const createSubject = useCreateSubject();

  const [newName, setNewName] = useState('');

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await createSubject.mutateAsync(trimmed);
      setNewName('');
    } catch {
      // keep the input so the teacher can retry
    }
  }

  return (
    <View>
      {/* Add subject form */}
      <Card style={{ marginBottom: 18 }}>
        <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Add subject
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Subject name (e.g. Mathematics)"
            placeholderTextColor={theme.muted2}
            returnKeyType="done"
            onSubmitEditing={() => { void handleAdd(); }}
            style={{
              flex: 1,
              backgroundColor: theme.surface,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14.5,
              color: theme.text,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          />
          <Pressable
            onPress={() => { void handleAdd(); }}
            disabled={createSubject.isPending || newName.trim() === ''}
            style={{
              backgroundColor:
                createSubject.isPending || newName.trim() === ''
                  ? theme.muted2
                  : theme.primary,
              width: 44,
              height: 44,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              ...(theme.shadowSm as object),
            }}
          >
            {createSubject.isPending ? (
              <Icon name="clock" size={20} stroke={2} color="#fff" />
            ) : (
              <Icon name="plus" size={22} stroke={2.6} color="#fff" />
            )}
          </Pressable>
        </View>
        {createSubject.isError ? (
          <Text style={{ color: theme.red, fontSize: 12.5, marginTop: 8 }}>
            Failed to add subject. Please try again.
          </Text>
        ) : null}
      </Card>

      {/* Subject list */}
      <SectionLabel>All subjects</SectionLabel>

      {isLoading ? (
        <View style={{ paddingTop: 24, alignItems: 'center' }}>
          <Text style={{ color: theme.muted, fontSize: 14 }}>Loading subjects…</Text>
        </View>
      ) : !subjects || subjects.length === 0 ? (
        <View style={{ paddingTop: 32, alignItems: 'center', gap: 10 }}>
          <Icon name="book" size={36} color={theme.muted2} />
          <Text style={{ color: theme.muted, fontSize: 14.5, textAlign: 'center' }}>
            No subjects yet. Add your first subject above.
          </Text>
        </View>
      ) : (
        <Card pad={4} style={{ marginBottom: 18 }}>
          {(subjects as Subject[]).map((subj: Subject, idx: number) => (
            <View
              key={subj.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: theme.border2,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  backgroundColor: theme.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="book" size={18} stroke={1.9} color={theme.primary} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: theme.text }}>
                {subj.name}
              </Text>
              <Icon name="chevR" size={16} color={theme.muted2} />
            </View>
          ))}
        </Card>
      )}

      {/* Optional Done affordance */}
      {subjects && subjects.length > 0 ? (
        <Pressable
          onPress={onDone}
          style={{
            paddingVertical: 13,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: theme.primary,
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 15 }}>Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
