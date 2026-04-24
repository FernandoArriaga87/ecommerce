import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Tailwind,
  Hr,
  Img,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  userFirstname: string;
}

export const WelcomeEmail = ({ userFirstname = 'Deportista' }: WelcomeEmailProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return (
    <Html>
      <Head />
      <Preview>Bienvenido a AuraSport — Tu nueva equipación te espera</Preview>
      <Tailwind>
        <Body className="bg-[#f6f6f6] my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-[#e5e5e5] rounded-[16px] my-[40px] mx-auto max-w-[520px] overflow-hidden">
            {/* Header */}
            <Section className="bg-[#111111] px-[32px] py-[28px]">
              <Text className="text-[13px] leading-[20px] text-white font-black tracking-[0.3em] uppercase m-0">
                AURASPORT
              </Text>
            </Section>

            {/* Body */}
            <Section className="px-[32px] pt-[40px] pb-[16px]">
              <Heading className="text-[#111111] text-[28px] font-black uppercase tracking-tight p-0 my-0 leading-[1.1]">
                ¡Bienvenido al<br />terreno de juego!
              </Heading>

              <Text className="text-[#111111] text-[15px] leading-[26px] mt-[20px] mb-0">
                Hola <strong>{userFirstname}</strong>,
              </Text>

              <Text className="text-[#444444] text-[15px] leading-[26px] mt-[12px]">
                Gracias por unirte a AuraSport. Aquí encontrarás camisas y prendas deportivas usadas importadas de tus equipos favoritos, con envío rápido a toda la República.
              </Text>

              <Text className="text-[#444444] text-[15px] leading-[26px] mt-[8px]">
                Esto es lo que puedes hacer ahora:
              </Text>

              {/* Benefits */}
              <Section className="mt-[16px] mb-[8px]">
                <Text className="text-[#111111] text-[14px] leading-[24px] m-0 pl-[8px]">
                  ⚽ Explorar nuestra colección de jerseys
                </Text>
                <Text className="text-[#111111] text-[14px] leading-[24px] m-0 pl-[8px]">
                  🏷️ Acceder a ofertas exclusivas para miembros
                </Text>
                <Text className="text-[#111111] text-[14px] leading-[24px] m-0 pl-[8px]">
                  📦 Envío gratis en pedidos mayores a $1,499 MXN
                </Text>
                <Text className="text-[#111111] text-[14px] leading-[24px] m-0 pl-[8px]">
                  🔄 Devoluciones fáciles en 30 días
                </Text>
              </Section>
            </Section>

            {/* CTA */}
            <Section className="text-center px-[32px] pt-[16px] pb-[32px]">
              <Button
                className="bg-[#111111] rounded-[8px] text-white text-[12px] font-black uppercase tracking-[0.2em] no-underline text-center px-[32px] py-[16px]"
                href={baseUrl}
              >
                Empezar a comprar
              </Button>
            </Section>

            {/* Footer */}
            <Hr className="border border-solid border-[#eaeaea] my-0 w-full" />
            <Section className="px-[32px] py-[24px]">
              <Text className="text-[#999999] text-[11px] leading-[18px] m-0 text-center">
                Si tienes alguna duda, responde directamente a este correo.
                Nuestro equipo te atenderá con gusto.
              </Text>
              <Text className="text-[#cccccc] text-[10px] leading-[18px] mt-[12px] text-center font-bold tracking-[0.2em] uppercase m-0">
                © {new Date().getFullYear()} AuraSport. Todos los derechos reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;