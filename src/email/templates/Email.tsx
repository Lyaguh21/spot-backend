import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

type EmailProps = {
  code?: string;
  logoSrc?: string;
};

export default function Email({
  code = "7A3K9M",
  logoSrc = "/static/FullLogo.png",
}: EmailProps) {
  const normalizedCode = code.trim().slice(0, 6).toUpperCase();
  const codeSymbols = normalizedCode.padEnd(6, " ").split("");

  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Код подтверждения SPOT: {normalizedCode}</Preview>
        <Body className="m-0 bg-[#050B18] dark:bg-[#050B18] px-2 sm:px-4 py-8 font-sans">
          <Container className="mx-auto max-w-[640px] rounded-[22px] border border-[#1F3158] bg-[#071326] dark:bg-[#071326] px-2 md:px-6 py-10 shadow-[0_0_48px_rgba(126,69,255,0.25)]">
            <Section className="text-center">
              <Img
                src={logoSrc}
                alt="SPOT"
                width="300"
                height="auto"
                className="mx-auto mb-10"
              />

              <Text className="m-0 text-[34px] font-bold leading-[1.2] text-white">
                Здравствуйте!
              </Text>
              <Text className="mb-0 mt-4 text-[18px] leading-[28px] text-[#BCC7DC]">
                Спасибо, что выбрали SPOT.
              </Text>
              <Text className="mx-auto mt-7 max-w-[460px] text-[17px] leading-[28px] text-[#A9B5CC]">
                Для подтверждения вашей почты введите код ниже в приложении. Код
                действителен в течение{" "}
                <span className="mx-auto font-bold max-w-[460px] text-[17px] leading-[28px] text-[#B276FF] mb-8">
                  10 минут
                </span>
              </Text>
            </Section>

            <Section className="rounded-[18px] border border-[#562D8B] bg-[#071022] p-2 shadow-[0_0_24px_rgba(147,79,255,0.22)]">
              <table
                role="presentation"
                width="100%"
                cellPadding="0"
                cellSpacing="0"
              >
                <tbody>
                  <tr>
                    {codeSymbols.map((symbol, index) => (
                      <td
                        key={`${symbol}-${index}`}
                        width="16.66%"
                        align="center"
                        className="px-[2px] sm:px-2"
                      >
                        <div className="aspect-square rounded-[10px] border border-[#24385F] bg-[#0E1A30] text-[40px] font-medium leading-none text-[#B276FF] shadow-[inset_0_1px_10px_rgba(255,255,255,0.05)] flex justify-center items-center">
                          <p className="my-auto mx-auto">{symbol}</p>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Section>

            <Section className="mt-8 rounded-[14px] border border-[#1B2D50] bg-[#0B172B] px-6 py-5">
              <Text className="m-0 text-[17px] font-semibold leading-[24px] text-white">
                Не передавайте этот код никому
              </Text>
              <Text className="mb-0 mt-2 text-[15px] leading-[24px] text-[#AAB6CC]">
                Сотрудники SPOT никогда не запрашивают коды подтверждения.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
