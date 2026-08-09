import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import {
  ABOUT_SECTION_KEYS,
  ABOUT_SECTION_ADD_LABELS,
  ABOUT_SECTION_LABELS,
  AboutSectionKey,
  ProfileContent,
  TALENT_CHIP_STYLES,
  isAboutSectionFilled,
} from '../../data/types';

/** Display-only preview length (~2–3 lines on typical phone widths). */
const BIO_PREVIEW_CHARS = 150;

interface AboutTabProps {
  content: ProfileContent;
  isOwn: boolean;
  onAdd: (key: AboutSectionKey) => void;
  onEdit: (key: AboutSectionKey) => void;
}

function ExpandableBio({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > BIO_PREVIEW_CHARS;

  if (!needsTruncation) {
    return <Text style={styles.bioText}>{text}</Text>;
  }

  if (expanded) {
    return (
      <Text style={styles.bioText}>
        {text}{' '}
        <Text
          style={styles.seeMore}
          onPress={() => setExpanded(false)}
          accessibilityRole="button"
          accessibilityLabel="See less"
        >
          see less
        </Text>
      </Text>
    );
  }

  return (
    <Text style={styles.bioText}>
      {`${text.slice(0, BIO_PREVIEW_CHARS).trimEnd()}... `}
      <Text
        style={styles.seeMore}
        onPress={() => setExpanded(true)}
        accessibilityRole="button"
        accessibilityLabel="See more"
      >
        see more
      </Text>
    </Text>
  );
}

export default function AboutTab({ content, isOwn, onAdd, onEdit }: AboutTabProps) {
  const anyFilled = ABOUT_SECTION_KEYS.some((key) => isAboutSectionFilled(content, key));

  // Visitor with nothing filled: labels only (no add CTAs)
  if (!anyFilled && !isOwn) {
    return (
      <View style={styles.list}>
        {ABOUT_SECTION_KEYS.map((key) => (
          <View key={key} style={styles.emptyRow}>
            <Text style={styles.emptyLabel}>{ABOUT_SECTION_LABELS[key]}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.filled}>
      {content.bio ? (
        <View style={styles.section}>
          <SectionHeader title="Bio" isOwn={isOwn} onEdit={() => onEdit('bio')} />
          <ExpandableBio text={content.bio} />
        </View>
      ) : null}

      {content.languages.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Languages"
            isOwn={isOwn}
            onEdit={() => onEdit('languages')}
            onAdd={() => onAdd('languages')}
          />
          {content.languages.map((lang, index) => (
            <View key={lang.id}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <View style={styles.langRow}>
                <View style={styles.flagCircle}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                </View>
                <View>
                  <Text style={styles.langName}>{lang.name}</Text>
                  <Text style={styles.langLevel}>{lang.level}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {content.talents.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Talents"
            isOwn={isOwn}
            onEdit={() => onEdit('talents')}
            onAdd={() => onAdd('talents')}
          />
          <View style={styles.chipWrap}>
            {content.talents.map((talent, index) => {
              const tone = TALENT_CHIP_STYLES[index % TALENT_CHIP_STYLES.length];
              return (
                <View key={talent} style={[styles.chip, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.chipText, { color: tone.text }]}>{talent}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {content.education.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Education"
            isOwn={isOwn}
            onEdit={() => onEdit('education')}
            onAdd={() => onAdd('education')}
          />
          {content.education.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <View style={styles.timelineRow}>
                <View
                  style={[
                    styles.orgLogo,
                    { backgroundColor: (item.logoColor ?? '#3B82F6') + '22' },
                  ]}
                >
                  <Ionicons
                    name="shield"
                    size={18}
                    color={item.logoColor ?? '#3B82F6'}
                  />
                </View>
                <View style={styles.timelineBody}>
                  <Text style={styles.cardTitle}>{item.degree}</Text>
                  <Text style={styles.cardSub}>{item.school}</Text>
                  <Text style={styles.cardMeta}>{item.years}</Text>
                  {item.gpa ? <Text style={styles.cardMeta}>GPA: {item.gpa}</Text> : null}
                  {item.description ? (
                    <Text style={styles.cardDesc}>{item.description}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {content.experience.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Experience"
            isOwn={isOwn}
            onEdit={() => onEdit('experience')}
            onAdd={() => onAdd('experience')}
          />
          {content.experience.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <View style={styles.timelineRow}>
                <View
                  style={[
                    styles.orgLogo,
                    { backgroundColor: item.logoColor ?? colors.primary },
                  ]}
                >
                  <Text style={styles.orgInitials}>
                    {(item.logoInitials ?? item.company.slice(0, 2)).slice(0, 3)}
                  </Text>
                </View>
                <View style={styles.timelineBody}>
                  <Text style={styles.cardTitle}>{item.company}</Text>
                  <Text style={styles.cardSub}>{item.title}</Text>
                  <Text style={styles.cardMeta}>{item.years}</Text>
                  {item.description ? (
                    <Text style={styles.cardDesc}>{item.description}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {content.certifications.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Certifications"
            isOwn={isOwn}
            onEdit={() => onEdit('certifications')}
            onAdd={() => onAdd('certifications')}
          />
          {content.certifications.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <View style={styles.timelineBody}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.org}</Text>
                <Text style={styles.cardMeta}>{item.year}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Own profile: always show add rows for empty sections (even when all empty) */}
      {isOwn &&
        ABOUT_SECTION_KEYS.filter((key) => !isAboutSectionFilled(content, key)).map((key) => (
          <TouchableOpacity
            key={key}
            style={styles.emptyRow}
            onPress={() => onAdd(key)}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyLabel}>{ABOUT_SECTION_ADD_LABELS[key]}</Text>
            <View style={styles.actionIconBtn}>
              <Ionicons name="add-outline" size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ))}
    </View>
  );
}

function SectionHeader({
  title,
  isOwn,
  onEdit,
  onAdd,
}: {
  title: string;
  isOwn: boolean;
  onEdit?: () => void;
  onAdd?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {isOwn ? (
        <View style={styles.actions}>
          {onEdit ? (
            <TouchableOpacity style={styles.actionIconBtn} onPress={onEdit} hitSlop={8}>
              <Ionicons name="pencil-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
          {onAdd ? (
            <TouchableOpacity style={styles.actionIconBtn} onPress={onAdd} hitSlop={8}>
              <Ionicons name="add-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyLabel: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  filled: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    lineHeight: 20,
  },
  seeMore: {
    color: colors.primary,
    fontWeight: '600',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  flagCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: { fontSize: 20 },
  langName: { ...typography.label, color: colors.text },
  langLevel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '500',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  orgLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgInitials: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  timelineBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: { ...typography.label, color: colors.text },
  cardSub: { ...typography.caption, color: colors.text },
  cardMeta: { ...typography.caption, color: colors.textSecondary },
  cardDesc: { ...typography.caption, color: colors.textTertiary, marginTop: 4, lineHeight: 18 },
});
