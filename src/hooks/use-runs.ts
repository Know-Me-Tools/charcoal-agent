import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useStreamingMessage } from "@/hooks/use-threads";
import type { Run, StartRunPayload, ToolCallEvent } from "@/types";

export function useStartRun() {
  const qc = useQueryClient();
  const { startStreaming, appendContent, addToolCall, updateToolCall, finishStreaming } =
    useStreamingMessage();

  return useMutation({
    mutationFn: async (payload: StartRunPayload) => {
      const run = await api.post<Run>("/api/uar/runs", payload);
      startStreaming(run.id);

      const eventSource = new EventSource(`/api/uar/runs/${run.id}/stream`);

      return new Promise<Run>((resolve, reject) => {
        eventSource.addEventListener("message.delta", (e) => {
          const data = JSON.parse(e.data) as { content: string };
          appendContent(data.content);
        });

        eventSource.addEventListener("tool_call.complete", (e) => {
          const data = JSON.parse(e.data) as {
            tool_name: string;
            arguments: Record<string, unknown>;
            run_id: string;
          };
          addToolCall({
            id: crypto.randomUUID(),
            tool_name: data.tool_name,
            arguments: data.arguments,
            status: "calling",
          });
        });

        eventSource.addEventListener("tool_result", (e) => {
          const data = JSON.parse(e.data) as {
            tool_name: string;
            result: string;
          };
          // Find the last tool call with this name and update it
          const tc: Partial<ToolCallEvent> = {
            result: data.result,
            status: "complete",
          };
          // We update the most recent tool call matching the name
          updateToolCall(data.tool_name, tc);
        });

        eventSource.addEventListener("error", (e) => {
          if (e instanceof MessageEvent) {
            const data = JSON.parse(e.data) as { message: string };
            console.error("Run error:", data.message);
          }
          finishStreaming();
          eventSource.close();
          reject(new Error("Stream error"));
        });

        eventSource.addEventListener("done", () => {
          finishStreaming();
          eventSource.close();
          qc.invalidateQueries({ queryKey: ["threads"] });
          resolve(run);
        });

        eventSource.onerror = () => {
          finishStreaming();
          eventSource.close();
          reject(new Error("EventSource connection failed"));
        };
      });
    },
  });
}
