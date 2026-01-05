import * as React from "react";
import Svg, { G, Path, Defs, ClipPath, Rect } from "react-native-svg";

interface EditIconProps {
    width?: number;
    height?: number;
    color?: string;
}

export const EditIcon: React.FC<EditIconProps> = ({
    width = 16,
    height = 16,
    color = "#000000"
}) => (
    <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
        <G clipPath="url(#clip0_54317_496)">
            <Path
                d="M7.3335 2.66665H2.66683C2.31321 2.66665 1.97407 2.80713 1.72402 3.05718C1.47397 3.30723 1.3335 3.64637 1.3335 3.99999V13.3333C1.3335 13.6869 1.47397 14.0261 1.72402 14.2761C1.97407 14.5262 2.31321 14.6667 2.66683 14.6667H12.0002C12.3538 14.6667 12.6929 14.5262 12.943 14.2761C13.193 14.0261 13.3335 13.6869 13.3335 13.3333V8.66665M12.3335 1.66665C12.5987 1.40144 12.9584 1.25244 13.3335 1.25244C13.7086 1.25244 14.0683 1.40144 14.3335 1.66665C14.5987 1.93187 14.7477 2.29158 14.7477 2.66665C14.7477 3.04173 14.5987 3.40144 14.3335 3.66665L8.00016 9.99999L5.3335 10.6667L6.00016 7.99999L12.3335 1.66665Z"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </G>
        <Defs>
            <ClipPath id="clip0_54317_496">
                <Rect width="16" height="16" fill="white" />
            </ClipPath>
        </Defs>
    </Svg>
);
