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
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  userFirstname: string;
}

export const WelcomeEmail = ({ userFirstname = 'Deportista' }: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bienvenido a DeportivoStore - Equípate para la gloria</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Text className="text-[14px] leading-[24px] text-black font-black tracking-widest uppercase">
                DEPORTIVOSTORE
              </Text>
            </Section>
            <Heading className="text-black text-[24px] font-black uppercase tracking-tight text-center p-0 my-[30px] mx-0">
              ¡Bienvenido al terreno de juego!
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hola {userFirstname},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Gracias por registrarte en DeportivoStore. Estamos listos para llevarte la mejor indumentaria deportiva directo a tu puerta, con garantía de autenticidad y envío rápido.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-black rounded-none text-white text-[12px] font-black uppercase tracking-widest no-underline text-center px-10 py-4"
                href="https://tusitio.com"
              >
                Empezar a comprar
              </Button>
            </Section>
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Si tienes alguna duda, responde a este correo o comunícate con nuestro soporte técnico.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;