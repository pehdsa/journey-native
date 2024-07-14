import { View, Text } from "react-native"
import { TripData } from "./[id]";

type Props = {
    tripDatails: TripData
}

export function Activities({ tripDatails }: Props) {
    return (
        <View>
            <Text className="text-white">Activities</Text>
        </View>
    )
}