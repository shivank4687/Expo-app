import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface GridIconProps {
    width?: number;
    height?: number;
    color?: string;
}

export const GridIcon: React.FC<GridIconProps> = ({
    width = 14,
    height = 14,
    color = "#000000"
}) => (
    <Svg width={width} height={height} viewBox="0 0 14 14" fill="none">
        <Path
            d="M5.41667 0.75H0.75V5.41667H5.41667V0.75Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M12.75 0.75H8.08333V5.41667H12.75V0.75Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M12.75 8.08333H8.08333V12.75H12.75V8.08333Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M5.41667 8.08333H0.75V12.75H5.41667V8.08333Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);
