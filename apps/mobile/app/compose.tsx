/**
 * app/compose.tsx
 * Teacher compose screen — create a new digital-booklet entry.
 * Uses CreateMessageDto shape from @schoolbridge/types.
 *
 * Fields:
 *  - type (MessageType)
 *  - target (MessageTarget: PUPIL | CLASS | SCHOOL)
 *  - pupilId (when target = PUPIL) — TODO: pupil picker
 *  - classId (when target = CLASS) — TODO: class picker
 *  - title
 *  - body
 *  - dueAt (for HOMEWORK / EVENT)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import type { MessageType, MessageTarget } from '@schoolbridge/types';
import { useCreateMessage } from '../src/hooks/useCreateMessage';
import { Button } from '../components';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../src/theme';

const MESSAGE_TYPES: MessageType[] = [
  'NOTE', 'HOMEWORK', 'BEHAVIOUR', 'ATTENDANCE',
  'RESULT', 'ANNOUNCEMENT', 'FEE_REMINDER', 'EVENT',
];

const TYPE_LABELS: Record<MessageType, string> = {
  NOTE: 'Note',
  HOMEWORK: 'Homework',
  BEHAVIOUR: 'Behaviour',
  ATTENDANCE: 'Attendance',
  RESULT: 'Result',
  ANNOUNCEMENT: 'Announcement',
  FEE_REMINDER: 'Fee Reminder',
  EVENT: 'Event',
};

const TARGETS: MessageTarget[] = ['PUPIL', 'CLASS', 'SCHOOL'];

export default function ComposeScreen() {
  const router = useRouter();
  const createMsg = useCreateMessage();

  const [type, setType] = useState<MessageType>('NOTE');
  const [target, setTarget] = useState<MessageTarget>('CLASS');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dueAt, setDueAt] = useState('');

  // TODO: replace with a searchable picker populated from /pupils and /classes
  const [pupilId, setPupilId] = useState('');
  const [classId, setClassId] = useState('');

  const showDueAt = type === 'HOMEWORK' || type === 'EVENT';

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for this message.');
      return;
    }
    if (target === 'PUPIL' && !pupilId.trim()) {
      Alert.alert('Missing pupil', 'Please enter a pupil ID or use the pupil picker.');
      return;
    }
    if (target === 'CLASS' && !classId.trim()) {
      Alert.alert('Missing class', 'Please enter a class ID or use the class picker.');
      return;
    }

    const dto = {
      type,
      target,
      title: title.trim(),
      body: body.trim() || undefined,
      attachments: [] as string[],
      ...(target === 'PUPIL' && { pupilId: pupilId.trim() }),
      ...(target === 'CLASS' && { classId: classId.trim() }),
      ...(showDueAt && dueAt ? { dueAt: new Date(dueAt) } : {}),
    };

    createMsg.mutate(dto as Parameters<typeof createMsg.mutate>[0], {
      onSuccess: () => {
        Alert.alert('Sent!', 'Your message has been created.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      },
      onError: (err) => {
        Alert.alert('Failed to send', err.message);
      },
    });
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Compose',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.brand,
          headerShadowVisible: false,
          presentation: 'modal',
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type selector */}
          <Text style={styles.label}>Message type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
            contentContainerStyle={styles.chipRowContent}
          >
            {MESSAGE_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.chip, type === t && styles.chipActive]}
              >
                <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                  {TYPE_LABELS[t]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Target selector */}
          <Text style={styles.label}>Send to</Text>
          <View style={styles.targetRow}>
            {TARGETS.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTarget(t)}
                style={[styles.targetBtn, target === t && styles.targetBtnActive]}
              >
                <Text style={[styles.targetText, target === t && styles.targetTextActive]}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Pupil ID field */}
          {target === 'PUPIL' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Pupil ID</Text>
              {/* TODO: replace with PupilPickerModal */}
              <TextInput
                style={styles.input}
                placeholder="Paste pupil UUID (picker coming soon)"
                placeholderTextColor={Colors.textMuted}
                value={pupilId}
                onChangeText={setPupilId}
              />
            </View>
          )}

          {/* Class ID field */}
          {target === 'CLASS' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Class ID</Text>
              {/* TODO: replace with ClassPickerModal */}
              <TextInput
                style={styles.input}
                placeholder="Paste class UUID (picker coming soon)"
                placeholderTextColor={Colors.textMuted}
                value={classId}
                onChangeText={setClassId}
              />
            </View>
          )}

          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Maths homework – Chapter 4"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              returnKeyType="next"
            />
            <Text style={styles.charCount}>{title.length}/200</Text>
          </View>

          {/* Body */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Body (optional)</Text>
            <TextInput
              style={[styles.input, styles.bodyInput]}
              placeholder="Details, instructions, remarks…"
              placeholderTextColor={Colors.textMuted}
              value={body}
              onChangeText={setBody}
              multiline
              maxLength={5000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{body.length}/5000</Text>
          </View>

          {/* Due date */}
          {showDueAt && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Due / Event date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (e.g. 2025-09-15)"
                placeholderTextColor={Colors.textMuted}
                value={dueAt}
                onChangeText={setDueAt}
                keyboardType="numbers-and-punctuation"
              />
              <Text style={styles.hint}>
                TODO: replace with a native date picker
              </Text>
            </View>
          )}

          <Button
            label="Send message"
            onPress={handleSubmit}
            loading={createMsg.isPending}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  fieldGroup: { marginBottom: 0 },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  bodyInput: {
    height: 120,
    paddingTop: 14,
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Type chips
  chipRow: { marginBottom: Spacing.sm },
  chipRowContent: { gap: Spacing.xs, paddingRight: Spacing.md },
  chip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandLight,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  chipTextActive: {
    color: Colors.brand,
  },
  // Target buttons
  targetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  targetBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  targetBtnActive: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandLight,
  },
  targetText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  targetTextActive: {
    color: Colors.brand,
    fontWeight: FontWeight.semibold,
  },
  submitBtn: {
    marginTop: Spacing.lg,
  },
});
