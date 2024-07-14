import { View, Text } from "react-native"

export function Details({ tripId }: { tripId: string }) {
    return (
        <View>
            <Text className="text-white">{ tripId }</Text>
        </View>
    )
}