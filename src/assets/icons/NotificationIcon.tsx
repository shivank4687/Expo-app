import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface NotificationIconProps {
    width?: number;
    height?: number;
    color?: string;
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({
    width = 16,
    height = 16,
    color = "black"
}) => (
    <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
        <Path
            d="M8 1C8 1 4 2.5 4 7V11L2.5 12.5V13H13.5V12.5L12 11V7C12 2.5 8 1 8 1Z"
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <Path
            d="M6.5 13C6.5 13.8284 7.17157 14.5 8 14.5C8.82843 14.5 9.5 13.8284 9.5 13"
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
        <Path
            d="M8 1V0.5"
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
        />
    </Svg>
);
