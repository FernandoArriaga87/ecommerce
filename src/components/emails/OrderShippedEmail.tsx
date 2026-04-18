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
} from '@react-email/components';
import * as React from 'react';

interface OrderShippedEmailProps {
  orderNumber: string;
  customerName: string;
}

export const OrderShippedEmail = ({ orderNumber = 'DS-1234', customerName = 'Juan' }: OrderShippedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>¡Tu paquete ya va en camino! - Pedido {orderNumber}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Text className="text-[14px] leading-[24px] text-black font-black tracking-widest uppercase">
                DEPORTIVOSTORE
              </Text>
            </Section>
            <Heading className="text-black text-[24px] font-black uppercase tracking-tight text-center p-0 my-[30px] mx-0">
              ¡Tu pedido fue ENVIADO!
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hola {customerName},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              ¡Grandes noticias! Tu pedido <strong>{orderNumber}</strong> ha salido de nuestro almacén y ha sido entregado a la paquetería correspondiente.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Puedes revisar tu panel de control para dar seguimiento en tiempo real al estatus de entrega de tu pedido.
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-black rounded-none text-white text-[12px] font-black uppercase tracking-widest no-underline text-center px-10 py-4"
                href={`https://tusitio.com/orders`}
              >
                Rastrear Envío
              </Button>
            </Section>
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Gracias por confiar en DeportivoStore. Que disfrutes tu nueva equipación.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderShippedEmail;