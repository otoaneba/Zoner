import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionModalProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'sleep' | 'nursing';
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  duration?: string;
}

// First, create a new component for the action button
const AnimatedButton = React.memo(({ 
  isActive, 
  onStart, 
  onStop, 
  slideAnim 
}: { 
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  slideAnim: Animated.Value;
}) => (
  <Animated.View
    style={{
      width: '100%',
      transform: [{
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [100, 0], // Start from below and slide up with modal
        }),
      }],
    }}
  >
    <TouchableOpacity onPress={isActive ? onStop : onStart}>
      <Animated.View
        style={[
          styles.actionButton,
          {
            backgroundColor: isActive ? '#BF616A' : '#3B4252',
            opacity: slideAnim, // Fade in as it slides up
          },
        ]}
      >
        <Text style={styles.buttonText}>
          {isActive ? 'Stop' : 'Start'}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  </Animated.View>
));

// Then modify the main modal component
export default function ActionModal({ 
  isVisible, 
  onClose, 
  type, 
  isActive,
  onStart,
  onStop,
  duration 
}: ActionModalProps) {
  const [slideAnim] = React.useState(new Animated.Value(0));
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [isVisible]);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.backdrop, { opacity: fadeAnim }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {type === 'sleep' ? 'Sleep Session' : 'Nursing Session'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {isActive && duration && (
            <Text style={styles.duration}>{duration}</Text>
          )}

          <AnimatedButton
            isActive={isActive}
            onStart={onStart}
            onStop={onStop}
            slideAnim={slideAnim}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    margin: 0, // Important: remove default modal margins
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 200,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 36,
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  actionButton: {
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 