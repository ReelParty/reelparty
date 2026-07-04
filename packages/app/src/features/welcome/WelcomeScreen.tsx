"use client";

import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { trpc } from "@reelparty/api";
import { Button, ButtonText, Icons, Screen, Spinner } from "@reelparty/ui";
import { useApp } from "../../provider";
import { useUserId } from "../../hooks/useUserId";
import { useAppNavigation } from "../../navigation/useAppNavigation";
import { WelcomeLockup } from "../../components/WelcomeLockup";
import { WelcomeTexture } from "../../components/WelcomeTexture";

export function WelcomeScreen() {
  const me = useUserId();
  const { session } = useApp();
  const nav = useAppNavigation();
  const utils = trpc.useUtils();
  const [restoring, setRestoring] = useState(true);
  const checked = useRef(false);

  // On first load, resume an in-progress party if the session is still valid.
  useEffect(() => {
    if (!me || checked.current) return;
    checked.current = true;
    void (async () => {
      const s = await session.loadSession();
      if (!s?.code) {
        setRestoring(false);
        return;
      }
      try {
        const members = await utils.party.members.fetch({ code: s.code });
        if (members.some((m) => m.id === me)) {
          nav.goParty(s.code);
          return;
        }
      } catch {
        /* fall through to welcome */
      }
      await session.saveSession(null);
      setRestoring(false);
    })();
  }, [me, session, utils, nav]);

  if (restoring) {
    return (
      <Screen>
        <Spinner center />
      </Screen>
    );
  }

  return (
    <Screen className="relative overflow-hidden">
      <WelcomeTexture />
      <View className="relative z-10 mt-7 items-center">
        <WelcomeLockup />
      </View>
      <View className="flex-1" />
      <View className="relative z-10 gap-3.5 pb-5">
        <Button tone="green" full onPress={nav.goCreate}>
          <Icons.Sparkles size={20} color="#fff" />
          <ButtonText>CREATE A PARTY</ButtonText>
        </Button>
        <Button tone="blue" full onPress={nav.goJoin}>
          <Icons.Users size={20} color="#fff" />
          <ButtonText>JOIN A PARTY</ButtonText>
        </Button>
      </View>
    </Screen>
  );
}
