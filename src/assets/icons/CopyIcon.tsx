import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface CopyIconProps {
    width?: number;
    height?: number;
    color?: string;
}

export const CopyIcon: React.FC<CopyIconProps> = ({
    width = 16,
    height = 16,
    color = '#000000'
}) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
            <Path
                d="M6 2V14M3.33333 2H12.6667C13.403 2 14 2.59695 14 3.33333V12.6667C14 13.403 13.403 14 12.6667 14H3.33333C2.59695 14 2 13.403 2 12.6667V3.33333C2 2.59695 2.59695 2 3.33333 2Z"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
};
