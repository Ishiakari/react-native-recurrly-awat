import React, { useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { styled } from "nativewind";

const StyledPressable = styled(Pressable);

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; price: number; plan: string }) => void;
}

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onSubmit,
}: CreateSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [plan, setPlan] = useState("");

  const handleSubmit = () => {
    if (!name || !price) return;
    onSubmit({
      name,
      price: parseFloat(price) || 0,
      plan: plan || "Basic",
    });
    setName("");
    setPrice("");
    setPlan("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text className="text-xl font-bold mb-4">Add Subscription</Text>
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            placeholder="Plan (e.g. Monthly, Premium)"
            value={plan}
            onChangeText={setPlan}
            style={styles.input}
          />
          <View style={styles.buttonRow}>
            <StyledPressable
              onPress={onClose}
              className="bg-gray-200 px-4 py-2 rounded-lg"
            >
              <Text className="text-black font-semibold">Cancel</Text>
            </StyledPressable>
            <StyledPressable
              onPress={handleSubmit}
              className="bg-primary px-4 py-2 rounded-lg ml-2"
            >
              <Text className="text-white font-semibold">Add</Text>
            </StyledPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
});
