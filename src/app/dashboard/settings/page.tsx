"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AiSettings from "@/components/settings/AiSettings";
import ApiKeySettings from "@/components/settings/ApiKeySettings";
import DisplaySettings from "@/components/settings/DisplaySettings";
import MyProfileContainer from "@/components/my-profile/MyProfileContainer";
import SettingsSidebar, {
  isSettingsSection,
  type SettingsSection,
} from "@/components/settings/SettingsSidebar";

function Settings() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    isSettingsSection(sectionParam) ? sectionParam : "my-profile",
  );

  useEffect(() => {
    if (isSettingsSection(sectionParam)) {
      setActiveSection(sectionParam);
      return;
    }
    router.replace(`${pathname}?section=my-profile`, { scroll: false });
  }, [sectionParam, pathname, router]);

  const onSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    router.replace(`${pathname}?section=${section}`, { scroll: false });
  };

  return (
    <div className="flex flex-col col-span-3">
      <h3 className="text-2xl font-semibold leading-none tracking-tight mb-4">
        Settings
      </h3>
      <div className="flex gap-6">
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
        <div className="flex-1 min-w-0">
          {activeSection === "my-profile" && (
            <MyProfileContainer embedded />
          )}
          {activeSection === "ai-provider" && <AiSettings />}
          {activeSection === "api-keys" && <ApiKeySettings />}
          {activeSection === "appearance" && <DisplaySettings />}
        </div>
      </div>
    </div>
  );
}

export default Settings;
