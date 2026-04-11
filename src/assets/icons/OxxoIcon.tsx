import * as React from "react";
import { Image, StyleSheet, View } from "react-native";

interface OxxoIconProps {
  width?: number;
  height?: number;
}

export const OxxoIcon: React.FC<OxxoIconProps> = ({
  width = 70,
  height = 48,
}) => (
  <View style={[styles.container, { width, height }]}>
    <Image
      source={require("./oxxo.png")}
      style={styles.image}
      resizeMode="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default OxxoIcon;
