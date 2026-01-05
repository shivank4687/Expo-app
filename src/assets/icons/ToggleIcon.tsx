import React from 'react';
import Svg, { G, Path, Defs, ClipPath, Rect } from 'react-native-svg';

interface ToggleIconProps {
    width?: number;
    height?: number;
    color?: string;
}

export const ToggleIcon: React.FC<ToggleIconProps> = ({
    width = 16,
    height = 16,
    color = '#000000'
}) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
            <G clipPath="url(#clip0_54317_1080)">
                <Path
                    d="M10.6665 3.33331H5.33317C2.75584 3.33331 0.666504 5.42265 0.666504 7.99998C0.666504 10.5773 2.75584 12.6666 5.33317 12.6666H10.6665C13.2438 12.6666 15.3332 10.5773 15.3332 7.99998C15.3332 5.42265 13.2438 3.33331 10.6665 3.33331Z"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <Path
                    d="M5.33317 9.99998C6.43774 9.99998 7.33317 9.10455 7.33317 7.99998C7.33317 6.89541 6.43774 5.99998 5.33317 5.99998C4.2286 5.99998 3.33317 6.89541 3.33317 7.99998C3.33317 9.10455 4.2286 9.99998 5.33317 9.99998Z"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </G>
            <Defs>
                <ClipPath id="clip0_54317_1080">
                    <Rect width="16" height="16" fill="white" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
