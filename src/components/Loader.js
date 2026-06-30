import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const Heart = () => (
  <View style={styles.itemContainer}>
    <View style={styles.heartSquare}>
      <View style={styles.heartLeftCircle} />
      <View style={styles.heartTopCircle} />
    </View>
  </View>
);

const Cross = ({ rotateAnim }) => {
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.itemContainer}>
      <Animated.View style={[styles.crossWrapper, { transform: [{ rotate: rotation }] }]}>
        <View style={[styles.crossLine, { transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.crossLine, { transform: [{ rotate: '-45deg' }] }]} />
      </Animated.View>
    </View>
  );
};

const Robot = ({ blinkAnim }) => {
  return (
    <View style={styles.itemContainer}>
      <View style={styles.robotHead}>
        <View style={styles.eyesContainer}>
          <Animated.View style={[styles.eye, { transform: [{ scaleY: blinkAnim }] }]} />
          <Animated.View style={[styles.eye, { transform: [{ scaleY: blinkAnim }] }]} />
        </View>
      </View>
    </View>
  );
};

export default function Loader() {
  const scroll1 = useRef(new Animated.Value(0)).current;
  const scroll2 = useRef(new Animated.Value(0)).current;
  const scroll3 = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Column 1 animation: scrolls down (100% native driver loop)
    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.timing(scroll1, {
          toValue: 55,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scroll1, {
          toValue: 55,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scroll1, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scroll1, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Column 2 animation: scrolls down + rotates (100% native driver loop)
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scroll2, {
            toValue: 55,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scroll2, {
          toValue: 55,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(scroll2, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scroll2, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // Column 3 animation: scrolls up + blinks eyes (100% native driver loop)
    const anim3 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scroll3, {
            toValue: -55,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(blink, { toValue: 0.1, duration: 250, useNativeDriver: true }),
            Animated.timing(blink, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(scroll3, {
          toValue: -55,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(scroll3, {
            toValue: 0,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(blink, { toValue: 0.1, duration: 250, useNativeDriver: true }),
            Animated.timing(blink, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(scroll3, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [scroll1, scroll2, scroll3, rotate, blink]);

  return (
    <View style={styles.loaderContainer}>
      {/* Column 1: Hearts */}
      <View style={styles.columnContainer}>
        <Animated.View style={[styles.carousel, { transform: [{ translateY: scroll1 }] }]}>
          <Heart />
          <Heart />
          <Heart />
        </Animated.View>
      </View>

      {/* Column 2: Crosses */}
      <View style={styles.columnContainer}>
        <Animated.View style={[styles.carousel, { transform: [{ translateY: scroll2 }] }]}>
          <Cross rotateAnim={rotate} />
          <Cross rotateAnim={rotate} />
          <Cross rotateAnim={rotate} />
        </Animated.View>
      </View>

      {/* Column 3: Robots */}
      <View style={styles.columnContainer}>
        <Animated.View style={[styles.carousel, { transform: [{ translateY: scroll3 }] }]}>
          <Robot blinkAnim={blink} />
          <Robot blinkAnim={blink} />
          <Robot blinkAnim={blink} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flexDirection: 'row',
    width: 200,
    height: 55,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnContainer: {
    width: 50,
    height: 55,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  carousel: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  itemContainer: {
    width: 50,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartSquare: {
    width: 20,
    height: 20,
    backgroundColor: '#ff3b30',
    transform: [{ rotate: '45deg' }],
    position: 'relative',
    top: 4,
  },
  heartLeftCircle: {
    position: 'absolute',
    left: -10,
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff3b30',
  },
  heartTopCircle: {
    position: 'absolute',
    top: -10,
    left: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff3b30',
  },
  crossWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  crossLine: {
    position: 'absolute',
    width: 6,
    height: 28,
    borderRadius: 3,
    backgroundColor: '#ff3b30',
  },
  robotHead: {
    width: 24,
    height: 24,
    backgroundColor: '#ff3b30',
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 14,
    alignItems: 'center',
  },
  eye: {
    width: 4,
    height: 6,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
});
