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

interface OrderPaidEmailProps {
  orderNumber: string;
  customerName: string;
  total: string;
}

export const OrderPaidEmail = ({ orderNumber = 'DS-1234', customerName = 'Juan', total = '$1,899.00' }: OrderPaidEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>¡Pago Confirmado! - Pedido {orderNumber}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Text className="text-[14px] leading-[24px] text-black font-black tracking-widest uppercase">
                DEPORTIVOSTORE
              </Text>
            </Section>
            <Heading className="text-black text-[24px] font-black uppercase tracking-tight text-center p-0 my-[30px] mx-0">
              ¡Hemos recibido tu pago!
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hola {customerName},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Buenas noticias. Tu pago por el pedido <strong>{orderNumber}</strong> ha sido procesado con éxito por un total de <strong>{total}</strong>.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Nuestro equipo de almacén ya está preparando tu paquete. Te enviaremos otro correo en cuanto tu orden sea enviada con el código de rastreo oficial.
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-black rounded-none text-white text-[12px] font-black uppercase tracking-widest no-underline text-center px-10 py-4"
                href="https://tusitio.com/orders"
              >
                Ver Estado del Pedido
              </Button>
            </Section>
            <Text className="text-[#666666] text-[12px] leading-[24px] uppercase font-bold tracking-widest text-center">
              DeportivoStore - Envío Seguro
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderPaidEmail;