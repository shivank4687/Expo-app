import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface ListIconProps {
    width?: number;
    height?: number;
    color?: string;
}

export const ListIcon: React.FC<ListIconProps> = ({
    width = 14,
    height = 10,
    color = "#000000"
}) => (
    <Svg width={width} height={height} viewBox="0 0 14 10" fill="none">
        <Path
            d="M4.08333 0.75H12.75M4.08333 4.75H12.75M4.08333 8.75H12.75M0.75 0.75H0.756667M0.75 4.75H0.756667M0.75 8.75H0.756667"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);
