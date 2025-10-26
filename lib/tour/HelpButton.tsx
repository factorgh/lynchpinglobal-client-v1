"use client";

import { useTour } from "@reactour/tour";
import { QuestionCircleOutlined } from "@ant-design/icons";

export const HelpButton = () => {
  const { setIsOpen } = useTour();
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-5 right-5 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
    >
      <QuestionCircleOutlined />
    </button>
  );
};
