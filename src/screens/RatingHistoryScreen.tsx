import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';

import { Header, PhoneFrame } from '../components/layout';
import { YELLOW } from '../constants';
import { getRides } from '../services/storage/rideStorage';
import { useAppStyles } from '../styles';
import { useTheme } from '../theme/ThemeContext';
import type { GoToScreen, Ride } from '../types';

function formatRideDate(timestamp: number): string {
  return new Intl.DateTimeFormat('sl-SI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function RatingHistoryScreen({ go }: { go: GoToScreen }) {
  const [savedRides, setSavedRides] = useState<Ride[]>([]);
  const styles = useAppStyles();
  const { colors } = useTheme();

  useEffect(() => {
    getRides().then(setSavedRides);
  }, []);

  const reviewedRides = useMemo(
    () =>
      savedRides
        .filter((item) => typeof item.userRating === 'number' && Boolean(item.userComment?.trim()))
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, 5),
    [savedRides],
  );

  const averageRating = useMemo(() => {
    const ratedRides = savedRides.filter((item) => typeof item.userRating === 'number');
    if (ratedRides.length === 0) {
      return { rating: 0, count: 0 };
    }
    const rating = ratedRides.reduce((sum, item) => sum + (item.userRating ?? 0), 0) / ratedRides.length;
    return { rating, count: ratedRides.length };
  }, [savedRides]);

  return (
    <PhoneFrame>
      <Header title="Ocena" back="home" go={go} />
      <ScrollView contentContainerStyle={styles.ratingContent} showsVerticalScrollIndicator={false}>
        <View style={styles.centerBlock}>
          <Star size={64} color={YELLOW} fill={averageRating.count > 0 ? YELLOW : 'none'} strokeWidth={1.8} />
          <Text style={styles.ratingQuestion}>Zadnje ocene vozenj</Text>
        </View>
        <View style={styles.ratingAverageCard}>
          <View>
            <Text style={styles.ratingAverageLabel}>Povprecna ocena vozenj</Text>
            <Text style={styles.ratingAverageMeta}>
              {averageRating.count > 0 ? `${averageRating.count} ocenjenih vozenj` : 'Ni se ocenjenih vozenj'}
            </Text>
          </View>
          <Text style={styles.ratingAverageValue}>
            {averageRating.count > 0 ? `${averageRating.rating.toFixed(1)}/5` : '-'}
          </Text>
        </View>
        <View style={styles.ratingReviewList}>
          {reviewedRides.length > 0 ? (
            reviewedRides.map((item) => (
              <Pressable
                key={item.id}
                style={styles.ratingReviewCard}
                onPress={() => go('details', { rideId: item.id })}
              >
                <View style={styles.ratingReviewHeader}>
                  <Text style={styles.ratingReviewDate}>{formatRideDate(item.startTime)}</Text>
                  <View style={styles.ratingReviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        color={star <= (item.userRating ?? 0) ? YELLOW : colors.textMuted}
                        fill={star <= (item.userRating ?? 0) ? YELLOW : 'none'}
                        strokeWidth={1.8}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.ratingReviewComment}>{item.userComment}</Text>
                <Text style={styles.ratingReviewLink}>Odpri podrobnosti voznje</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyState}>Ni se komentarjev pri ocenjenih voznjah.</Text>
          )}
        </View>
      </ScrollView>
    </PhoneFrame>
  );
}
