import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutModal } from "@/components/cart/CheckoutModal";

const renderModal = (onSubmitted = vi.fn()) => {
  render(<CheckoutModal isOpen onClose={vi.fn()} onSubmitted={onSubmitted} />);
  return {
    phone: screen.getByLabelText("Телефон"),
    name: screen.getByLabelText("Имя"),
    submit: screen.getByRole("button", { name: "Отправить заявку" }),
    onSubmitted,
  };
};

describe("CheckoutModal: телефон", () => {
  it.each(["0501234567", "+380501234567", "380501234567"])(
    "ввод «%s» приводится к одному виду",
    async (input) => {
      const { phone } = renderModal();

      await userEvent.type(phone, input);

      expect(phone).toHaveValue("+380 50 123 45 67");
    },
  );

  it("вставка номера в любом виде тоже форматируется", async () => {
    const { phone } = renderModal();

    await userEvent.click(phone);
    await userEvent.paste("(050) 123-45-67");

    expect(phone).toHaveValue("+380 50 123 45 67");
  });

  it("буквы в поле не попадают", async () => {
    const { phone } = renderModal();

    await userEvent.type(phone, "abc");

    expect(phone).toHaveValue("");
  });

  it("неполный номер не отправляется, полный — отправляется", async () => {
    const { phone, name, submit, onSubmitted } = renderModal();
    await userEvent.type(name, "Анна");

    await userEvent.type(phone, "05012");
    await userEvent.click(submit);
    expect(onSubmitted).not.toHaveBeenCalled();

    await userEvent.type(phone, "34567");
    await userEvent.click(submit);
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });
});
