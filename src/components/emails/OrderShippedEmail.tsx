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
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface OrderShippedEmailProps {
  orderNumber: string;
  customerName: string;
  estimatedDelivery?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export const OrderShippedEmail = ({
  orderNumber = 'DS-1234',
  customerName = 'Juan',
  estimatedDelivery = '3-5 días hábiles',
  carrier,
  trackingNumber,
  trackingUrl,
}: OrderShippedEmailProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return (
    <Html>
      <Head />
      <Preview>📦 ¡Tu pedido {orderNumber} va en camino!</Preview>
      <Tailwind>
        <Body className="bg-[#f6f6f6] my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-[#e5e5e5] rounded-[16px] my-[40px] mx-auto max-w-[520px] overflow-hidden">
            {/* Header */}
            <Section className="bg-[#111111] px-[32px] py-[28px]">
              <Row>
                <Column>
                  <Text className="text-[13px] leading-[20px] text-white font-black tracking-[0.3em] uppercase m-0">
                    AURASPORT
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-[11px] leading-[20px] text-white/60 font-bold tracking-wide uppercase m-0">
                    Actualización de Envío
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Icon */}
            <Section className="px-[32px] pt-[36px] pb-[8px] text-center">
              <Text className="text-[40px] leading-[48px] m-0">📦</Text>
              <Heading className="text-[#111111] text-[26px] font-black uppercase tracking-tight p-0 mt-[12px] mb-0 leading-[1.1]">
                ¡Tu pedido fue enviado!
              </Heading>
              <Text className="text-[#888888] text-[13px] font-bold tracking-wide uppercase mt-[8px] mb-0">
                Pedido {orderNumber}
              </Text>
            </Section>

            {/* Body */}
            <Section className="px-[32px] pt-[20px]">
              <Text className="text-[#111111] text-[15px] leading-[26px] m-0">
                Hola <strong>{customerName}</strong>,
              </Text>
              <Text className="text-[#444444] text-[15px] leading-[26px] mt-[12px]">
                ¡Grandes noticias! Tu pedido <strong>{orderNumber}</strong> ya salió de nuestro almacén y está en camino a tu dirección.
              </Text>
            </Section>

            {/* Delivery Info */}
            <Section className="mx-[32px] mt-[24px] mb-[24px] bg-[#f8f8f8] rounded-[12px] px-[24px] py-[24px]">
              <Row>
                <Column>
                  <Text className="text-[10px] font-black tracking-[0.2em] uppercase text-[#999999] m-0">
                    Entrega estimada
                  </Text>
                  <Text className="text-[#111111] text-[15px] font-black leading-[24px] m-0 mt-[4px]">
                    {estimatedDelivery}
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-[10px] font-black tracking-[0.2em] uppercase text-[#999999] m-0">
                    Paquetería
                  </Text>
                  <Text className="text-[#3b82f6] text-[15px] font-black leading-[24px] m-0 mt-[4px]">
                    {carrier || '📦 Por confirmar'}
                  </Text>
                </Column>
              </Row>

              {trackingNumber && (
                <Section className="mt-[20px] pt-[20px] border-t border-solid border-[#eeeeee]">
                  <Text className="text-[10px] font-black tracking-[0.2em] uppercase text-[#999999] m-0">
                    Número de rastreo
                  </Text>
                  <Text className="m-0 mt-[4px]">
                    {trackingUrl ? (
                      <a
                        href={trackingUrl}
                        className="text-[#111111] text-[18px] font-black leading-[24px] no-underline hover:underline"
                      >
                        {trackingNumber}
                      </a>
                    ) : (
                      <span className="text-[#111111] text-[18px] font-black leading-[24px]">
                        {trackingNumber}
                      </span>
                    )}
                  </Text>
                  {trackingUrl && (
                    <Text className="text-[11px] text-[#3b82f6] font-bold mt-[4px] m-0">
                      Haz clic en el número para rastrear directamente.
                    </Text>
                  )}
                </Section>
              )}
            </Section>

            <Section className="px-[32px] pt-[8px]">
              <Text className="text-[#444444] text-[14px] leading-[24px]">
                Puedes revisar el estado de tu pedido en cualquier momento desde tu panel de control o haciendo clic en el botón de abajo.
              </Text>
            </Section>

            {/* CTA */}
            <Section className="text-center px-[32px] pt-[16px] pb-[32px]">
              <Button
                className="bg-[#111111] rounded-[8px] text-white text-[12px] font-black uppercase tracking-[0.2em] no-underline text-center px-[32px] py-[16px]"
                href={trackingUrl || `${baseUrl}/orders`}
              >
                Rastrear mi Pedido
              </Button>
            </Section>

            {/* Footer */}
            <Hr className="border border-solid border-[#eaeaea] my-0 w-full" />
            <Section className="px-[32px] py-[24px]">
              <Text className="text-[#999999] text-[11px] leading-[18px] m-0 text-center">
                Gracias por confiar en AuraSport. ¡Que disfrutes tu nueva equipación!
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

export default OrderShippedEmail;